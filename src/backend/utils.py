import schemas_extended


def paginate(query, model, page: int = 1, size: int = 20):
    try:
        total = query.count()
        items = query.offset((page - 1) * size).limit(size).all()
        items_data = []
        for item in items:
            # Manually convert to dict to avoid Pydantic from_attributes
            # issues
            item_dict = {
                c.name: getattr(item, c.name) for c in item.__table__.columns
            }
            items_data.append(model.model_validate(item_dict))
        result = {
            "total": total,
            "page": page,
            "size": size,
            "pages": (total + size - 1) // size if size > 0 else 1,
            "items": items_data,
        }
        # Force validation here to catch errors
        return schemas_extended.ResidentPaginatedExtended(**result)
    except Exception as e:
        print(f"PAGINATION ERROR: {e}")
        import traceback

        traceback.print_exc()
        raise e
