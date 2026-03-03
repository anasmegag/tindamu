"""
feed_service.py — Logique métier pour le Feed (Posts, Swipes, Matches).
"""

from app import db
from app.models.post import Post, PostStatusEnum
from app.models.swipe import Swipe, SwipeDirectionEnum
from app.models.match import Match
from sqlalchemy import or_

def create_post(author_id, data):
    """
    Crée un nouveau post dans le feed.
    """
    post = Post(
        author_id=author_id,
        type=data['type'],
        thematique=data['thematique'],
        titre=data['titre'],
        contenu=data['contenu'],
        tags=data.get('tags', []),
        status=PostStatusEnum.ACTIF
    )
    db.session.add(post)
    db.session.commit()
    return post

def get_feed_posts(user_id):
    """
    Récupère les posts à afficher dans le feed Tinder pour un utilisateur donné.
    Exclut :
      - Ses propres posts
      - Les posts sur lesquels il a déjà swipé
    """
    # Récupérer les IDs des posts déjà swipés
    swiped_post_ids = [s.post_id for s in Swipe.query.filter_by(swiper_id=user_id).all()]
    
    # Filtrer les posts
    query = Post.query.filter(
        Post.author_id != user_id,
        Post.status == PostStatusEnum.ACTIF,
        Post.id.notin_(swiped_post_ids) if swiped_post_ids else True
    ).order_by(Post.created_at.desc())
    
    return query.all()

def handle_swipe(swiper_id, post_id, direction):
    """
    Enregistre un swipe et vérifie s'il y a un match.
    """
    post = Post.query.get_or_404(post_id)
    
    # Créer le swipe
    swipe = Swipe(
        swiper_id=swiper_id,
        post_id=post_id,
        post_author_id=post.author_id,
        direction=SwipeDirectionEnum(direction)
    )
    db.session.add(swipe)
    
    match = None
    # Si c'est un LIKE, vérifier le match réciproque
    if direction == SwipeDirectionEnum.LIKE.value:
        # Existe-t-il un post de 'swiper_id' que 'post.author_id' a déjà LIKÉ ?
        reciprocal_swipe = Swipe.query.filter_by(
            swiper_id=post.author_id,
            post_author_id=swiper_id,
            direction=SwipeDirectionEnum.LIKE
        ).first()
        
        if reciprocal_swipe:
            # Match !
            match = Match(
                user1_id=swiper_id,
                user2_id=post.author_id,
                post_id=post_id
            )
            db.session.add(match)

            # Créer automatiquement la conversation privée entre les deux utilisateurs
            from app.services.conversation_service import create_private_conversation
            conversation = create_private_conversation(swiper_id, post.author_id)
            match.conversation_id = conversation.id
            
    db.session.commit()
    return swipe, match
